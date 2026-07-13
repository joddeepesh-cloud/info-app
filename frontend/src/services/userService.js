import axios from "axios";

const API = window.API_BASE_URL + "/users";

export const getUsers = async () => {
  const res = await axios.get(API);
  return res.data;
};

export const updateUser = async (id, data) => {
  const res = await axios.put(`${API}/${id}`, data);
  return res.data;
};