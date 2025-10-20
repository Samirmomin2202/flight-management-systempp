import axios from "axios";

// Separate axios for generic API root (not only flights)
const http = axios.create({ baseURL: "http://localhost:5000/api" });

export const listSlides = async (activeOnly = true) => {
  const params = activeOnly ? { active: true } : {};
  const { data } = await http.get("/slides", { params });
  return data.slides || [];
};

export const createSlide = async (payload) => {
  const { data } = await http.post("/slides", payload);
  return data.slide;
};

export const updateSlide = async (id, payload) => {
  const { data } = await http.put(`/slides/${id}`, payload);
  return data.slide;
};

export const deleteSlide = async (id) => {
  await http.delete(`/slides/${id}`);
  return true;
};
