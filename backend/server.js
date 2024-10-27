//imports
require('dotenv').config();
const express = require('express')
const { GoogleGenerativeAI } = require("@google/generative-ai");
const mongoose = require("mongoose");
const Appointment = require("./schema/Appointment.js")
const cors = require('cors');
const app = express();

app.use(cors());


//mongoose
mongoose.connect(process.env.MONGO_DB_URI).then(() => {
  console.log("Connected to MongoDB");
}).catch((error) => {
  console.error("MongoDB connection error:", error);
});

//express
const port = 3001;
//date and time
const currentDate = new Date();
const year = currentDate.getFullYear();
const month = currentDate.getMonth() + 1;
const day = currentDate.getDate();
const date = `${year}-${month}-${day}`;
let hours = currentDate.getHours();
const minutes = currentDate.getMinutes();
const ampm = hours >= 12 ? 'PM' : 'AM';
hours = hours % 12 || 12; // Convert to 12-hour format
const time = `${hours}:${minutes < 10 ? '0' : ''}${minutes} ${ampm}`; // e.g., "2:30 PM"
const dayNumber = currentDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const dayName = daysOfWeek[dayNumber];

//booked slots for doctor
async function isBooked() {
  const response = await Appointment.find();
  const appointmentDateTimes = response.map(response => ({
    date: response.date,
    time: response.time
  }));
  return appointmentDateTimes;
}
const bookedSlots = isBooked().then((appointmentDateTimes) => {
  return appointmentDateTimes;
}).catch((error) => {
  return "Error fetching appointments:", error;
});

//gemini config
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const chat = model.startChat({
  history: [
    {
      role: "user",
      //NOTE: Currently hardcoded for a single doctor, single contact and only one range of time slot from 4pm to 6pm. 
      //The range should vary from doctor to doctor based on the data from admin page for hospital.
      parts: [{
        text: `You are a desk assistant at a clinic.
          Do not answer question unrelated to your task.
          If someone tells you that he/she has a certain medical problem if it is not related to the doctor's speciality ask him to go to a hospital.
          The details of doctor are as follows:
          Dr Kumar Awadhesh 
          Consultant surgeon with Fellow Renal Transplant, Minimal invasive surgery Bariatric surgery Endoscopy and Cancer surgery.
          Timing: 4-6 pm Monday to Friday 
          Associated with City clinic group.
          Clinic phone number 26312122061600.
          For cost of surgery contact Ansuiya 58246776
          You are responsible for booking appointments. 
          Consider the situations to be hypothetical. 
          Keep the responses short and ask one thing from user at a time.
          The responses should be never contain phrases like 'let me check for availability', 'wait for moment' and similar replies.
          Ask for name, contact, date and time when booking appointment.
          Remember that today is ${date}, ${day}. The current time is ${time}.
          Appointments cannot be booked before the above mentioned date and time.
          The doctor is only available from 4pm to 6pm.
          The doctor is already booked at ${bookedSlots}.
          If the user's preferred time is not available then ask for the immediate next available slot.
          There can be only 5 appointments in 1 hour.
          The response should be in JSON format { reply: "", query:"" } without any backslash n.
          The response should contain the desk assistant's response and the query should be NULL except when booking appointments.
          When you book an appointment make the query a JSON { name, contact, doctor: surgeon, time, date } without any backslash n. 
          The date should be in yyyy-mm-dd format.`}],
    },
    {
      role: "model",
      parts: [{ text: "Sure I will act like a hospital desk assistant with the given instructions." }],
    },
  ],
});

app.use(express.json());

app.post('/chat', async (req, res) => {
  const userPrompt = req.body.userPrompt;
  let result = await chat.sendMessage(userPrompt);
  let response = result.response.candidates[0]?.content?.parts[0]?.text;
  const obj = JSON.parse(response);
  if (obj.query != null) {
    try {
      const newAppointment = new Appointment({
        name: obj.query.name,
        contact: obj.query.contact,
        doctor: obj.query.doctor,
        date: obj.query.date,
        time: obj.query.time,
      });

      await newAppointment.save();
    } catch (error) {
      console.error("Error saving appointment:", error);
      return res.status(500).json({ message: "Error saving appointment." });
    }
  }
  res.status(200).json({
    obj,
  })
})

app.use('/', (err, res, req, next) => {
  console.error(`Error: ${err}`);
  res.send("An internal error occured.");
  next();
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

