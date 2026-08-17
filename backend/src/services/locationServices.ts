import { Request, Response } from 'express';
import axios from 'axios';
import { Pickuparea, Pickupcity } from '../models';
import { USERS } from "../utils/costants";
const { ROLES } = USERS;

export const getCountries = async (req: Request, res: Response) => {
  try {
    const response = await axios.get('https://countriesnow.space/api/v0.1/countries/positions');
    const countries = response.data.data.map((c: any) => c.name);
    res.json(countries);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching countries' });
  }
};

export const getStates = async (req: Request, res: Response) => {
  const { country } = req.body;

  if (!country) return res.status(400).json({ message: 'Country is required' });

  try {
    const response = await axios.post('https://countriesnow.space/api/v0.1/countries/states', { country });
    const states = response.data.data.states.map((s: any) => s.name);
    res.json(states);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching states' });
  }
};

export const getCities = async (req: Request, res: Response) => {
  const { country, state } = req.body;

  if (!country || !state) {
    return res.status(400).json({ message: 'Country and state are required' });
  }

  try {
    const response = await axios.post('https://countriesnow.space/api/v0.1/countries/state/cities', { country, state });
    const cities = response.data.data;
    res.json(cities);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching cities' });
  }
};

export const addPickupCity = async (req: any, res: Response) => {
  const { country,state,pickupCity,sortOrder,isPickupCity } = req.body;
  try {
    const role = req.role;
        if (role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }

    const existing = await Pickupcity.findOne({ where: { pickupCity } });
    if (existing) return res.status(400).json({ message: 'pickupcity already registered' });
    
    const pickupcity = await Pickupcity.create({ country,state,pickupCity,sortOrder,isPickupCity  });

     res.status(201).json({ message: 'Registered successfully', pickupcity })
    } catch (err) {
    res.status(500).json({ error: err });
  }
};


export const addPickUpArea = async (req: Request, res: Response) => {
  try {
    const { pickupCity, pickupArea } = req.body;
    const existingCity = await Pickupcity.findOne({
      where: {
        pickupCity
      } 
    });

    if(!existingCity) {
       return res.status(400).json({
    message: 'City not exists',
      });
    }

    const existingArea = await Pickuparea.findOne({
  where: {
      pickupCity,
      pickupArea
    }
  });

  if (existingArea) {
  return res.status(400).json({
    message: 'Area already exists',
  });
}

const newArea = await Pickuparea.create({
  pickupCity,
  pickupArea
});

res.status(201).json({
  message: 'Pickup area added successfully',
  data: newArea
});
  } catch (error: any) {
    res.status(400).json({
      message: 'Error updating pickuparea',
      error: error.message,
    });
  }
};
