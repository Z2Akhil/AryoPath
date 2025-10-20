import { useState } from 'react';
import { UserContext } from './userContext';
const dummyUser = {
  phone: "9999999999",
  password: "password123",
  name: "John Doe",
  avatar: ""
};

// This is the only export from this file
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Dummy registration function
  const register = (name, phone, password, otp) => {
    return new Promise((resolve, reject) => {
      // Simulate API call and OTP check
      if (otp === "123456") {
        console.log("Registration successful for:", { name, phone });
        const newUser = { phone, password, name, avatar: "" };
        // Log the new user in immediately
        setUser(newUser);
        resolve({ success: true, user: newUser });
      } else {
        console.error("Registration failed: Invalid OTP");
        reject({ success: false, message: "Invalid OTP" });
      }
    });
  };

  // Dummy login function
  const login = (phone, password) => {
    return new Promise((resolve, reject) => {
      // Simulate API call
      if (phone === dummyUser.phone && password === dummyUser.password) {
        console.log("Login successful");
        setUser(dummyUser); // Set the user in state
        resolve({ success: true, user: dummyUser });
      } else {
        console.error("Login failed: Invalid credentials");
        reject({ success: false, message: "Invalid phone number or password" });
      }
    });
  };

  // Logout function
  const logout = () => {
    console.log("User logged out");
    setUser(null); // Clear the user from state
  };

  const value = {
    user,
    register,
    login,
    logout,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};