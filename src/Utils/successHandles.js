export const successHandle = ({
  res,
  message = "done",
  data = {},
  status = 200,
}) => {
  return res.status(status).json({
    status,
    message,
    data,
  });
};
