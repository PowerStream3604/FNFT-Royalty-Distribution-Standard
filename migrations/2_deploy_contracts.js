const TargetNFT = artifacts.require("TargetNFT");
// const RFT = artifacts.require("RFT");
// const FNFT = artifacts.require("FNFT");
module.exports = function (deployer) {
  deployer.deploy(TargetNFT);
  // deployer.deploy(RFT);
  // deployer.deploy(FNFT);
};
