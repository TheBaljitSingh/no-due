export const isAuthenticated = (req, res, next) => {
  //it it exist then only call isAuthenticated()
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  // Fallback check for non-Passport setups
  if (req.user) {
    return next();
  }
  return res.status(401).json({
    success: false,
    error: "UNAUTHENTICATED",
    message: "You must be logged in to access this resource.",
  });
};
