export const generateOTP = (length = 6) => {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
};

export const otpExpiryDate = (minutes = 10) => {
  const d = new Date();
  d.setMinutes(d.getMinutes() + minutes);
  return d;
};
