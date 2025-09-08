import { ethers } from 'ethers';

function getAmountOut(amountIn, reserveIn, reserveOut) {
  const amountInWithFee = amountIn.mul(997);
  const numerator = amountInWithFee.mul(reserveOut);
  const denominator = reserveIn.mul(1000).add(amountInWithFee);
  return numerator.div(denominator);
}

export function simulateTriangularArb(amountInA_Wei, reservesPath) {
  try {
    const amountOutB = getAmountOut(amountInA_Wei, reservesPath[0][0], reservesPath[0][1]);
    const amountOutC = getAmountOut(amountOutB, reservesPath[1][0], reservesPath[1][1]);
    const amountOutA_Final = getAmountOut(amountOutC, reservesPath[2][0], reservesPath[2][1]);
    const profit = amountOutA_Final.sub(amountInA_Wei);
    return {
      profit: profit,
      isProfitable: profit.gt(0),
      amountOut: amountOutA_Final
    };
  } catch (err) {
    console.error("Error in simulation:", err);
    return { profit: ethers.BigNumber.from(0), isProfitable: false, amountOut: ethers.BigNumber.from(0) };
  }
}
