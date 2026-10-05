const Service = require("../models/Service");

const parseServiceInput = ({ name, description, estimatedDuration, serviceFee }) => {
  if (typeof name !== "string" || !name.trim() || typeof description !== "string" || !description.trim()) {
    return { error: "Service name and description are required" };
  }
  if (!Number.isSafeInteger(estimatedDuration) || estimatedDuration < 1) {
    return { error: "Estimated duration must be a positive integer in minutes" };
  }
  if (typeof serviceFee !== "number" || !Number.isFinite(serviceFee) || serviceFee < 0) {
    return { error: "Service fee must be a nonnegative number" };
  }
  return { name: name.trim(), description: description.trim(), estimatedDuration, serviceFee };
};

exports.getServices = async (req, res, next) => {
  try {
    const services = await Service.find({ isActive: true }).sort({ name: 1 });
    res.status(200).json({ success: true, count: services.length, data: services });
  } catch (error) {
    next(error);
  }
};

exports.getService = async (req, res, next) => {
  try {
    const service = await Service.findOne({ _id: req.params.id, isActive: true });
    if (!service) return res.status(404).json({ success: false, error: "Service package not found" });
    res.status(200).json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

exports.createService = async (req, res, next) => {
  try {
    const parsed = parseServiceInput(req.body);
    if (parsed.error) return res.status(400).json({ success: false, error: parsed.error });
    const service = await Service.create(parsed);
    res.status(201).json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

exports.updateService = async (req, res, next) => {
  try {
    const service = await Service.findOne({ _id: req.params.id, isActive: true });
    if (!service) return res.status(404).json({ success: false, error: "Service package not found" });
    const fields = {};
    for (const field of ["name", "description", "estimatedDuration", "serviceFee"]) {
      fields[field] = req.body[field] === undefined ? service[field] : req.body[field];
    }
    const parsed = parseServiceInput(fields);
    if (parsed.error) return res.status(400).json({ success: false, error: parsed.error });
    const updated = await Service.findOneAndUpdate(
      { _id: service.id, isActive: true }, parsed, { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ success: false, error: "Service package not found" });
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

exports.deleteService = async (req, res, next) => {
  try {
    const service = await Service.findOneAndUpdate(
      { _id: req.params.id, isActive: true }, { isActive: false }, { new: true }
    );
    if (!service) return res.status(404).json({ success: false, error: "Service package not found" });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
