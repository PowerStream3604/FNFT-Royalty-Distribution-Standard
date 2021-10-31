const TargetNFT = artifacts.require("TargetNFT");
const RFT = artifacts.require("RFT");
module.exports = function (deployer) {
  deployer.deploy(TargetNFT);
  //deployer.deploy(RFT);
};
