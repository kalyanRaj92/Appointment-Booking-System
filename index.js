import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import connectDB from './config/db.js';
import doctorRoutes from './routes/doctors.js';
import appointmentRoutes from './routes/appointments.js';

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json()); 


app.use('/doctors', doctorRoutes);
app.use('/appointments', appointmentRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});