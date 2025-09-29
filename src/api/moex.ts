class Moex {
  getFunding = async (candles = 50, interval = 1) => {
    return fetch(
      `https://iss.moex.com/cs/engines/futures/markets/swaprates/securities/CNYRUBF.hs?candles=${candles}&interval=${interval}`,
    );
  };
}

export const moexService = new Moex();
