import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    workingHours: {
        start: { type: String, required: true },
        end: { type: String, required: true },
    },
    specialization: { type: String },
});

const Doctor = mongoose.model('Doctor', doctorSchema);

export default Doctor;