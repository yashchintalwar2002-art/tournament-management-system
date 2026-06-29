import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8080",
});

API.interceptors.request.use((req) => {
  const token = sessionStorage.getItem("token");
  const email = sessionStorage.getItem("email");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  if (email) {
    req.headers["X-User-Email"] = email;
  }

  return req;
});

export default API;
