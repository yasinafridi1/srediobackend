import ErrorHandler from "../helpers/ErrorHandler.js";
import { verifyAccessToken } from "../helpers/JwtService.js";

const auth = async (req, res, next) => {
  try {
    const accesstoken = req.header("Authorization")?.split(" ")[1];

    if (!accesstoken) {
      return next(new ErrorHandler("Token not provided", 401));
    }
    const userData = await verifyAccessToken(accesstoken);
    req.user = userData;
    next();
  } catch (error) {
    return next(new ErrorHandler("JWT expired", 401));
  }
};

export default auth;
