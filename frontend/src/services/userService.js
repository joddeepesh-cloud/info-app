import axios from "axios";

const getApi = () => (window.API_BASE_URL || "https://info-app-backend-7r0e.onrender.com") + "/users";

export const getUsers = async () => {
  const res = await axios.get(getApi());
  return res.data;
};

export const updateUser = async (id, data) => {
  const res = await axios.put(`${getApi()}/${id}`, data);
  return res.data;
};