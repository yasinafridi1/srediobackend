/**
 * Success message to send response back
 * @param {string} res - response object
 * @param {string} message - Response message
 * @param {string} data - optional - if want to send data  in reponse
 * @param {string} status - optional - status code, by default it will be 200
 */

const SuccessMessage = (res, message, data = null, status = 200) => {
  console.log(message);
  return res.status(status).json({
    success: true,
    message,
    ...(data && {
      data,
    }),
  });
};
export default SuccessMessage;
