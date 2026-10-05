const Appointment = require("../models/Appointment");
const Service = require("../models/Service");

const populateAppointment = (query) => query
  .populate("service", "name description estimatedDuration serviceFee isActive")
  .populate("user", "name email tel role");

const parseAppointmentInput = ({ registrationNumber, brand, model, appointmentDate, startTime }) => {
  if (typeof registrationNumber !== "string" || !registrationNumber.trim()) {
    return { error: "Vehicle registration number is required" };
  }
  const normalized = registrationNumber.normalize("NFKC").replace(/[\s-]+/g, "").toUpperCase();
  if (!normalized) return { error: "Vehicle registration number is required" };
  if (typeof brand !== "string" || !brand.trim() || typeof model !== "string" || !model.trim()) {
    return { error: "Vehicle brand and model are required" };
  }
  if (typeof appointmentDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(appointmentDate)) {
    return { error: "A valid appointmentDate in YYYY-MM-DD format is required" };
  }
  const date = new Date(`${appointmentDate}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== appointmentDate) {
    return { error: "Invalid appointment date" };
  }
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (date < today) return { error: "Appointment date cannot be in the past" };
  if (typeof startTime !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime)) {
    return { error: "Start time must use HH:mm format" };
  }
  return {
    registrationNumber: normalized, brand: brand.trim(), model: model.trim(),
    appointmentDate: date, startTime,
    startsAt: new Date(`${appointmentDate}T${startTime}:00.000Z`),
  };
};

const validateAppointment = async ({ values, serviceId, user, existing }) => {
  const parsed = parseAppointmentInput(values);
  if (parsed.error) return { status: 400, error: parsed.error };
  if (typeof serviceId !== "string" || !/^[a-fA-F0-9]{24}$/.test(serviceId)) {
    return { status: 400, error: "Exactly one valid service ID is required" };
  }
  const service = await Service.findOne({ _id: serviceId, isActive: true });
  if (!service) return { status: 404, error: "Service package not found or inactive" };
  // Keep the booking's duration unless it changes to a different service package.
  const durationMinutes = existing && existing.service.toString() === service.id ? existing.durationMinutes : service.estimatedDuration;
  const endsAt = new Date(parsed.startsAt.getTime() + durationMinutes * 60 * 1000);
  if (Number.isNaN(endsAt.getTime())) {
    return { status: 400, error: "Service duration exceeds supported appointment date range" };
  }
  const exclude = existing ? { _id: { $ne: existing.id } } : {};
  const duplicate = await Appointment.findOne({
    user, registrationNumber: parsed.registrationNumber, appointmentDate: parsed.appointmentDate, ...exclude,
  });
  if (duplicate) return { status: 409, error: "Member can create at most one appointment per vehicle per day" };
  const conflict = await Appointment.findOne({
    registrationNumber: parsed.registrationNumber,
    startsAt: { $lt: endsAt }, endsAt: { $gt: parsed.startsAt }, ...exclude,
  });
  if (conflict) return { status: 409, error: "Vehicle already has an overlapping appointment" };
  const now = new Date();
  if (parsed.startsAt >= now) {
    const futureCount = await Appointment.countDocuments({ user, startsAt: { $gte: now }, ...exclude });
    if (futureCount >= 3) return { status: 409, error: "Member can have at most 3 future appointments" };
  }
  return { data: { ...parsed, service: service.id, durationMinutes, endsAt } };
};

const appointmentError = (error, res, next) => {
  if (error.code === 11000) {
    return res.status(409).json({ success: false, error: "Member can create at most one appointment per vehicle per day" });
  }
  next(error);
};

exports.getAppointments = async (req, res, next) => {
  try {
    const filter = req.user.role === "admin" ? {} : { user: req.user.id };
    const appointments = await populateAppointment(Appointment.find(filter).sort({ startsAt: 1, createdAt: 1 }));
    res.status(200).json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    next(error);
  }
};

exports.getAppointment = async (req, res, next) => {
  try {
    const appointment = await populateAppointment(Appointment.findById(req.params.id));
    if (!appointment) return res.status(404).json({ success: false, error: "Appointment not found" });
    if (req.user.role !== "admin" && appointment.user._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: "Not authorized to view this appointment" });
    }
    res.status(200).json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
};

exports.createAppointment = async (req, res, next) => {
  try {
    const validated = await validateAppointment({ values: req.body, serviceId: req.body.service, user: req.user.id });
    if (validated.error) return res.status(validated.status).json({ success: false, error: validated.error });
    const appointment = await Appointment.create({ ...validated.data, user: req.user.id });
    res.status(201).json({ success: true, data: await populateAppointment(Appointment.findById(appointment.id)) });
  } catch (error) {
    appointmentError(error, res, next);
  }
};

exports.updateAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, error: "Appointment not found" });
    if (req.user.role !== "admin" && appointment.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: "Not authorized to edit this appointment" });
    }
    const values = {};
    for (const field of ["registrationNumber", "brand", "model", "startTime"]) {
      values[field] = req.body[field] === undefined ? appointment[field] : req.body[field];
    }
    values.appointmentDate = req.body.appointmentDate === undefined ? appointment.appointmentDate.toISOString().slice(0, 10) : req.body.appointmentDate;
    const serviceId = req.body.service === undefined ? appointment.service.toString() : req.body.service;
    const validated = await validateAppointment({ values, serviceId, user: appointment.user, existing: appointment });
    if (validated.error) return res.status(validated.status).json({ success: false, error: validated.error });
    const updated = await Appointment.findByIdAndUpdate(
      req.params.id, validated.data, { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ success: false, error: "Appointment not found" });
    res.status(200).json({ success: true, data: await populateAppointment(Appointment.findById(updated.id)) });
  } catch (error) {
    appointmentError(error, res, next);
  }
};

exports.deleteAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, error: "Appointment not found" });
    if (req.user.role !== "admin" && appointment.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: "Not authorized to delete this appointment" });
    }
    await appointment.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
