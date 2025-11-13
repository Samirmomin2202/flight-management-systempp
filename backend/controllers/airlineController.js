import Airline from '../models/Airline.js';

// Seed data (public Wikipedia PNG/SVG assets)
const seedAirlines = [
  { name: 'IndiGo', iataCode: '6E', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/IndiGo_logo.svg/512px-IndiGo_logo.svg.png' },
  { name: 'Air India', iataCode: 'AI', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Air_India_Logo_2014.svg/512px-Air_India_Logo_2014.svg.png' },
  { name: 'Akasa Air', iataCode: 'QP', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Akasa_Air_logo.svg/512px-Akasa_Air_logo.svg.png' },
  { name: 'Alliance Air', iataCode: '9I', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Alliance_Air_logo.png/320px-Alliance_Air_logo.png' },
  { name: 'SpiceJet', iataCode: 'SG', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/SpiceJet_logo.svg/512px-SpiceJet_logo.svg.png', tailLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/SpiceJet_logo.svg/256px-SpiceJet_logo.svg.png' },
  { name: 'Emirates', iataCode: 'EK', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Emirates_logo.svg/512px-Emirates_logo.svg.png' }
];

export const getAirlines = async (req, res) => {
  try {
    let airlines = await Airline.find().sort({ name: 1 });
    if (!airlines.length) {
      console.log('🛫 Seeding airlines collection...');
      await Airline.insertMany(seedAirlines);
      airlines = await Airline.find().sort({ name: 1 });
      console.log('✅ Airlines seeded');
    } else {
      // Ensure Emirates exists
      const emirates = await Airline.findOne({ name: { $regex: /^Emirates$/i } });
      if (!emirates) {
        console.log('➕ Adding missing Emirates airline');
        await Airline.create(seedAirlines.find(a => a.name === 'Emirates'));
      }
      // Remove Air India Express if present
      const airIndiaExpress = await Airline.findOne({ name: { $regex: /^Air India Express$/i } });
      if (airIndiaExpress) {
        console.log('🗑 Removing Air India Express as requested');
        await Airline.deleteOne({ _id: airIndiaExpress._id });
      }
      airlines = await Airline.find().sort({ name: 1 });
    }
    res.json({ success: true, airlines });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const addAirline = async (req, res) => {
  try {
    const { name, logoUrl, tailLogoUrl, iataCode, country } = req.body;
    const exists = await Airline.findOne({ name });
    if (exists) return res.status(400).json({ success: false, message: 'Airline already exists' });
    // Handle uploaded files
    let finalLogo = logoUrl;
    let finalTailLogo = tailLogoUrl;
    if (req.files?.logo?.[0]) {
      const f = req.files.logo[0];
      finalLogo = `/uploads/airlines/${f.filename}`;
    }
    if (req.files?.tailLogo?.[0]) {
      const f = req.files.tailLogo[0];
      finalTailLogo = `/uploads/airlines/${f.filename}`;
    }
    const airline = new Airline({ name, logoUrl: finalLogo, tailLogoUrl: finalTailLogo, iataCode, country });
    await airline.save();
    res.json({ success: true, airline });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateAirline = async (req, res) => {
  try {
    const airline = await Airline.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, airline });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteAirline = async (req, res) => {
  try {
    await Airline.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
