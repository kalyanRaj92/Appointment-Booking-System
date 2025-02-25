import express from 'express'
import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';

const router = express.Router();
import { parseISO, format, addMinutes, isWithinInterval, startOfDay, endOfDay } from 'date-fns';


// Create a new doctor
router.post("/", async(req,res)=>{
    const { name, workingHours, specialization } = req.body;
    try {
        if (!name || !workingHours || !workingHours.start || !workingHours.end || !specialization) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const newDoctor = new Doctor({
            name,
            workingHours,
            specialization
        });

        const savedDoctor = await newDoctor.save();
        //const savedDoctor = await Doctor.insertMany(req.body);
        res.status(201).json({ message: "Doctor created successfully", savedDoctor});
    } catch (error) {
        res.status(500).json({ message: "Error creating doctor",error });
    }
})


// Get all doctors
router.get("/", async (req, res) => {
    try {
        const doctors = await Doctor.find();
        res.status(200).json(doctors);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving doctors', error });
    }
});


// Function to compute available slots
function computeAvailableSlots(workingHours, appointments, date) {
    const slots = [];
    
    // Convert working hours to UTC
    const start = new Date(`${date}T${workingHours.start}:00`);
    const end = new Date(`${date}T${workingHours.end}:00`);

    // Adjust working hours to UTC by subtracting 5h30m
    const startUtc = addMinutes(start, -330); // IST to UTC
    const endUtc = addMinutes(end, -330);

    // Loop through slots in 30-minute increments
    for (let current = startUtc; current < endUtc; current = addMinutes(current, 30)) {
        const slotStart = current; // Current slot start (UTC)
        const slotEnd = addMinutes(current, 30); // Current slot end (UTC)

        // Check if the slot overlaps with any appointment
        const isBooked = appointments.some(appointment => {
            const appointmentStart = new Date(appointment.date);
            const appointmentEnd = addMinutes(appointmentStart, appointment.duration);
            return (
                slotStart < appointmentEnd && 
                slotEnd > appointmentStart
            );
        });

        if (!isBooked) {
            // Convert UTC slot to IST for display
            const istSlot = addMinutes(current, 330); // UTC+5:30
            slots.push(format(istSlot, 'yyyy-MM-dd HH:mm:ss'));
        }
    }

    return slots;
}


// Get available slots for a specific doctor on a specific date
router.get('/:id/slots', async (req, res) => {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
        return res.status(400).json({ message: 'Date query parameter is required' });
    }

    try {
        const doctor = await Doctor.findById(id);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        // Fetch appointments for the doctor on the specified date
        const startOfDayUTC = startOfDay(new Date(date));
        const endOfDayUTC = endOfDay(new Date(date));

        const appointments = await Appointment.find({
            doctorId: doctor._id,
            date: {
                $gte: startOfDayUTC,
                $lt: endOfDayUTC
            }
        });

        // Compute available slots
        const availableSlots = computeAvailableSlots(doctor.workingHours, appointments, date);
        res.status(200).json(availableSlots);
    } catch (error) {
        console.error('Error in /slots endpoint:', error)
        res.status(500).json({ message: 'Error retrieving available slots', error });
    }
});



export default router;