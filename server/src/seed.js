import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "./models/User.js";
import Report from "./models/Report.js";

async function seed() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is missing in .env!");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB for seeding...");

  const passwordHash = await bcrypt.hash("Password123", 10);

  // 1. Seed Authority User (idempotent upsert)
  const authorityUser = await User.findOneAndUpdate(
    { email: "authority@civiceye.test" },
    {
      $set: {
        name: "Officer Priya Sharma",
        email: "authority@civiceye.test",
        passwordHash,
        role: "authority",
        department: "Roads",
      },
    },
    { upsert: true, new: true }
  );

  // 2. Seed Citizen User (idempotent upsert)
  const citizenUser = await User.findOneAndUpdate(
    { email: "citizen@civiceye.test" },
    {
      $set: {
        name: "Aarav Patel",
        email: "citizen@civiceye.test",
        passwordHash,
        role: "citizen",
        department: "Other",
      },
    },
    { upsert: true, new: true }
  );

  console.log("Seeded Users:");
  console.log("  Authority: authority@civiceye.test / Password123");
  console.log("  Citizen:   citizen@civiceye.test   / Password123");

  // 3. Clear existing seeded reports for idempotence
  await Report.deleteMany({ createdBy: { $in: [authorityUser._id, citizenUser._id] } });

  // 4. Sample civic reports around Bengaluru civic center
  const sampleReports = [
    {
      title: "Severe crater pothole near City General Hospital",
      description: "Deep 10-inch pothole in the emergency lane right outside City Hospital. High risk of vehicle damage and delay to ambulances.",
      category: "pothole",
      severity: "high",
      department: "Roads",
      priorityScore: 8.8,
      status: "open",
      location: { lat: 12.9719, lng: 77.5937, address: "MG Road outside City General Hospital, Central Ward" },
      imageUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
      duplicateCount: 4,
      upvotes: 18,
    },
    {
      title: "Broken streetlight array opposite St. Xavier High School",
      description: "Four consecutive streetlights unlit creating a dangerous pitch black corridor for students leaving evening tuition.",
      category: "streetlight",
      severity: "high",
      department: "Electricity",
      priorityScore: 7.9,
      status: "in_progress",
      location: { lat: 12.9765, lng: 77.5992, address: "Residency Road near St. Xavier High School" },
      imageUrl: "https://images.unsplash.com/photo-1508873696983-2df57046475a?auto=format&fit=crop&w=800&q=80",
      duplicateCount: 2,
      upvotes: 9,
    },
    {
      title: "Drinking water main pipe burst and road flooding",
      description: "High pressure pipeline ruptured; thousands of gallons of clean municipal water wasting onto commercial pavement.",
      category: "water",
      severity: "high",
      department: "Water",
      priorityScore: 8.4,
      status: "open",
      location: { lat: 12.9654, lng: 77.6015, address: "Richmond Circle near Junction Water Tank" },
      imageUrl: "https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&w=800&q=80",
      duplicateCount: 5,
      upvotes: 24,
    },
    {
      title: "Overflowing commercial garbage dumpster spreading onto sidewalk",
      description: "Dumpster has not been collected in 5 days. Rotting food waste, stray dogs, and blocking pedestrian path.",
      category: "garbage",
      severity: "medium",
      department: "Sanitation",
      priorityScore: 5.6,
      status: "open",
      location: { lat: 12.9698, lng: 77.6081, address: "Brigade Road Commercial Walkway" },
      imageUrl: "https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=800&q=80",
      duplicateCount: 3,
      upvotes: 12,
    },
    {
      title: "Fallen tree branch crushing bicycle lane and electric wire",
      description: "Heavy rain brought down a huge eucalyptus bough resting across low-voltage cables and blocking the green bicycle lane.",
      category: "tree",
      severity: "high",
      department: "Parks",
      priorityScore: 7.5,
      status: "in_progress",
      location: { lat: 12.9812, lng: 77.5912, address: "Cubbon Park North Gate Avenue" },
      imageUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80",
      duplicateCount: 1,
      upvotes: 8,
    },
    {
      title: "Multiple potholes spanning intersection",
      description: "Cluster of asphalt potholes slowing rush hour traffic to a standstill near shopping complex.",
      category: "pothole",
      severity: "medium",
      department: "Roads",
      priorityScore: 5.2,
      status: "open",
      location: { lat: 12.9734, lng: 77.6119, address: "100ft Road & 12th Main Cross, Indiranagar" },
      imageUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
      duplicateCount: 2,
      upvotes: 6,
    },
    {
      title: "Flickering halogen streetlight pole",
      description: "Single pole flickering continuously for the past week outside residential block.",
      category: "streetlight",
      severity: "low",
      department: "Electricity",
      priorityScore: 2.8,
      status: "open",
      location: { lat: 12.9621, lng: 77.5891, address: "Lalbagh West Gate Road" },
      imageUrl: "https://images.unsplash.com/photo-1508873696983-2df57046475a?auto=format&fit=crop&w=800&q=80",
      duplicateCount: 0,
      upvotes: 2,
    },
    {
      title: "Sewage manhole overflow emitting toxic foul odor",
      description: "Sewage overflowing near primary kindergarten entrance. Health risk for children and local neighborhood.",
      category: "water",
      severity: "high",
      department: "Water",
      priorityScore: 8.6,
      status: "open",
      location: { lat: 12.9789, lng: 77.6045, address: "Ulsoor Lake Road near Daisy Kindergarten" },
      imageUrl: "https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&w=800&q=80",
      duplicateCount: 3,
      upvotes: 15,
    },
    {
      title: "Construction rubble and cement debris dumped along curb",
      description: "Illegal night-time dumping of concrete blocks and tiles narrowing 2-lane road to single file.",
      category: "garbage",
      severity: "medium",
      department: "Sanitation",
      priorityScore: 4.8,
      status: "in_progress",
      location: { lat: 12.9582, lng: 77.6189, address: "Koramangala 4th Block Outer Ring Approach" },
      imageUrl: "https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=800&q=80",
      duplicateCount: 1,
      upvotes: 7,
    },
    {
      title: "Collapsed sidewalk pavers creating trip hazard",
      description: "Footpath slabs broke after utility excavation, leaving exposed cables and tripping risk for elderly pedestrians.",
      category: "road",
      severity: "medium",
      department: "Roads",
      priorityScore: 4.4,
      status: "resolved",
      location: { lat: 12.9751, lng: 77.5873, address: "KG Road Promenade" },
      imageUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
      afterImageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
      duplicateCount: 2,
      upvotes: 11,
    },
    {
      title: "Dead tree leaning perilously towards power lines",
      description: "Dry rotted pine tree tilting at 45 degrees directly above overhead electric cables.",
      category: "tree",
      severity: "high",
      department: "Parks",
      priorityScore: 7.2,
      status: "open",
      location: { lat: 12.9845, lng: 77.6023, address: "Coles Road & Davis Road Corner, Fraser Town" },
      imageUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80",
      duplicateCount: 1,
      upvotes: 5,
    },
    {
      title: "Deep trench pothole repaired and resurfaced",
      description: "Previously reported trench on Church Street repaired with hot-mix asphalt and leveled with curb.",
      category: "pothole",
      severity: "high",
      department: "Roads",
      priorityScore: 6.9,
      status: "resolved",
      location: { lat: 12.9748, lng: 77.6033, address: "Church Street Pedestrian Cross" },
      imageUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
      afterImageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
      duplicateCount: 4,
      upvotes: 21,
    },
    {
      title: "Damaged traffic divider barrier",
      description: "Concrete traffic divider knocked sideways by delivery truck, jutting into the oncoming fast lane.",
      category: "road",
      severity: "high",
      department: "Roads",
      priorityScore: 7.1,
      status: "in_progress",
      location: { lat: 12.9667, lng: 77.5954, address: "Langford Road Flyover Descent" },
      imageUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
      duplicateCount: 2,
      upvotes: 14,
    },
    {
      title: "Uncovered municipal drain pit",
      description: "Open stormwater drain grill stolen. Deep drop right next to bus stop.",
      category: "water",
      severity: "high",
      department: "Water",
      priorityScore: 8.1,
      status: "open",
      location: { lat: 12.9711, lng: 77.6074, address: "Mayo Hall Bus Terminus" },
      imageUrl: "https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&w=800&q=80",
      duplicateCount: 3,
      upvotes: 19,
    },
    {
      title: "Plastic packaging waste accumulation in public park",
      description: "Festive event leftovers not cleared, litter scattered across flower beds and walking track.",
      category: "garbage",
      severity: "low",
      department: "Sanitation",
      priorityScore: 3.2,
      status: "resolved",
      location: { lat: 12.9634, lng: 77.6052, address: "Madhavan Park Children's Play Area" },
      imageUrl: "https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=800&q=80",
      afterImageUrl: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80",
      duplicateCount: 1,
      upvotes: 4,
    },
  ];

  for (const rep of sampleReports) {
    await Report.create({
      ...rep,
      createdBy: citizenUser._id,
    });
  }

  console.log(`Successfully seeded ${sampleReports.length} civic reports!`);
  await mongoose.disconnect();
  console.log("Disconnected from MongoDB.");
}

seed().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});