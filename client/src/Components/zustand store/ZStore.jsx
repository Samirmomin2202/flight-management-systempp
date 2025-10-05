import { create } from "zustand";

const useFlightStore = create((set) => ({
  flightData: JSON.parse(localStorage.getItem("flight-data")) || null,
  passengers: localStorage.getItem("passengers") || 1,
  passengersInfo: [],
  showResult: JSON.parse(localStorage.getItem("flight-data")) || null,
  filteredResult: null,
  bookedFlight: JSON.parse(localStorage.getItem("booked-flight")) || null,
  allBookings: JSON.parse(localStorage.getItem("all-bookings")) || [],
  isLoggedIn: false,
  

  getIsLoggedIn: (login) => set(() => ({ isLoggedIn: login })),

  getBookedFlight: (booked) => {
    localStorage.setItem("booked-flight", JSON.stringify(booked));
    set(() => ({ bookedFlight: booked }));
  },

  clearBooking: () => {
    localStorage.removeItem("booked-flight");
    set(() => ({ bookedFlight: null }));
  },

  getAllBookings: (bookings) =>
    set((state) =>
      state.allBookings
        ? { allBookings: [...state.allBookings, bookings] }
        : { allBookings: [bookings] }
    ),

  removeAllBookings: () => set(() => ({ allBookings: [] })),

  getPassengersInfo: (info) =>
    set((state) => ({ passengersInfo: [...state.passengersInfo, info] })),

  removePassengersInfo: () => set(() => ({ passengersInfo: [] })),

  getPassengers: (number) => {
    localStorage.setItem("passengers", number);
    set(() => ({ passengers: number }));
  },

  addFlight: (search) => {
    localStorage.setItem("flight-data", JSON.stringify(search));
    set(() => ({ flightData: search }));
  },

  removeFlight: () => {
    localStorage.removeItem("flight-data");
    set(() => ({ flightData: null }));
  },

  getResult: (result) => set(() => ({ showResult: result })),

  getFiltered: (filtered) => set(() => ({ filteredResult: filtered })),

  removeFiltered: () => set(() => ({ filteredResult: null })),

  // **Add this function to remove booking by flightId**
  removeBooking: (flightId) =>
    set((state) => {
      const updatedBookings = state.allBookings.filter(
        (booking) => booking.flightInfo.id !== flightId
      );
      localStorage.setItem("all-bookings", JSON.stringify(updatedBookings));
      return { allBookings: updatedBookings };
    }),
}));

export default useFlightStore;
