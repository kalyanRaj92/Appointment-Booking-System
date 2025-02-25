import express from "express";
import Doctor from "../models/Doctor.js";
import Appointment from "../models/Appointment.js";

import { isWithinInterval, addMinutes} from 'date-fns';

const router = express.Router();

// Get all appointments
router.get("/", async (req, res) => {
  try {
    const appointments = await Appointment.find().populate("doctorId");
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving appointments", error });
  }
});


// Get a specific appointment by  Appointment ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const appointment = await Appointment.findById(id).populate("doctorId");
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    res.status(200).json(appointment);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving appointment by appointment Id", error });
  }
});


async function logExistingAppointments(doctorId) {
  const existingAppointments = await Appointment.find({ doctorId });
  //console.log('Existing Appointments:', existingAppointments);
}

// Function to check availability of a time slot
async function checkAvailability(doctorId, startTime, duration, appointmentId = null) {
  const endTime = addMinutes(startTime, duration);

  // Log existing appointments for the doctor
  await logExistingAppointments(doctorId);

  const conflictingAppointments = await Appointment.find({
    doctorId,
    _id: { $ne: appointmentId },
    $expr: {
      $and: [
        // Condition 1: Existing appointment starts before the new appointment ends
        { $lt: ["$date", endTime] },
        // Condition 2: Existing appointment ends after the new appointment starts
        { 
          $gt: [
            { $add: ["$date", { $multiply: ["$duration", 60000] }] }, // existingEnd = date + duration (in ms)
            startTime 
          ]
        }
      ]
    }
  });

  //console.log('Conflicting Appointments:', conflictingAppointments);
  //console.log(conflictingAppointments.length === 0);
  return conflictingAppointments.length === 0; // Return true if no conflicts
}

// Create a new appointment
router.post('/', async (req, res) => {
  const { doctorId, date, duration, appointmentType, patientName, notes } = req.body;

  // Validate input
  if (!doctorId || !date || !duration || !appointmentType || !patientName) {
      return res.status(400).json({ message: 'All fields are required' });
  }

  try {
      // Fetch doctor's working hours
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
          return res.status(404).json({ message: 'Doctor not found' });
      }

      // Check if the requested time slot is available
      const startTime = new Date(date);
      const endTime = addMinutes(startTime, duration);
      
      // Check if the appointment is within working hours
      const workingHoursStart = doctor.workingHours.start;
      const workingHoursEnd = doctor.workingHours.end;

      // Create Date objects for working hours
      const workingStart = new Date(`${date.split('T')[0]}T${workingHoursStart}:00Z`); // Use the date part from the input
      const workingEnd = new Date(`${date.split('T')[0]}T${workingHoursEnd}:00Z`); 

      // Check if the appointment is within working hours
      if (!isWithinInterval(startTime, { start: workingStart, end: workingEnd }) || 
          !isWithinInterval(endTime, { start: workingStart, end: workingEnd })) {
          return res.status(400).json({ message: 'Appointment is outside of working hours.' });
      }

      const isAvailable = await checkAvailability(doctorId, startTime, duration);
      if (!isAvailable) {
          return res.status(400).json({ message: 'Time slot is not available. Please choose a different time.' });
      }

      const newAppointment = new Appointment({
          doctorId,
          date: startTime,
          duration,
          appointmentType,
          patientName,
          notes
      });

      const savedAppointment = await newAppointment.save();
      res.status(201).json({message: "Appointment Created successfully", savedAppointment});
  } catch (error) {
      console.error('Error creating appointment:', error); 
      res.status(500).json({ message: 'Error creating appointment', error });
  }
});


// Update an existing appointment
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { doctorId, date, duration, appointmentType, patientName, notes } = req.body;

  // Validate input
  if (!doctorId || !date || !duration || !appointmentType || !patientName) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Fetch doctor's working hours
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Check if the requested time slot is available
    const startTime = new Date(date);
    const endTime = addMinutes(startTime, duration);

    // Check working hours (same as create route)
    const workingHoursStart = doctor.workingHours.start;
    const workingHoursEnd = doctor.workingHours.end;
    const workingStart = new Date(`${date.split('T')[0]}T${workingHoursStart}:00Z`);
    const workingEnd = new Date(`${date.split('T')[0]}T${workingHoursEnd}:00Z`);

    if (
      !isWithinInterval(startTime, { start: workingStart, end: workingEnd }) ||
      !isWithinInterval(endTime, { start: workingStart, end: workingEnd })
    ) {
      return res.status(400).json({ message: 'Appointment is outside of working hours.' });
    }

    // Check availability (pass the appointment ID to exclude it from conflicts)
    const isAvailable = await checkAvailability(doctorId, startTime, duration, id);
    if (!isAvailable) {
      return res.status(400).json({ message: 'Time slot is not available. Please choose a different time.' });
    }

    // Update the appointment
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      {
        doctorId,
        date: startTime,
        duration,
        appointmentType,
        patientName,
        notes,
      },
      { new: true } // Return the updated document
    );

    if (!updatedAppointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.status(200).json({ message: 'Appointment updated successfully', updatedAppointment });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ message: 'Error updating appointment', error });
  }
});


// Delete an appointment
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const appointment = await Appointment.findByIdAndDelete(id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.status(204).status(201).json({ message: "Appointment Deleted Successfully" });
  }catch (error) {
    res.status(500).json({ message: "Server error deleting appointment", error });
  }
});

export default router;
