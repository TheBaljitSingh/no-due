export const isAuthenticated = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "You must login first" });
  }
  next();
};
