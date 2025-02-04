export default (router) => {
  // return response to prevent server from sleeping
  router.get("/stayAlive", (req, res) => {
    res.status(200).send("No sleep for me!");
  });
};
