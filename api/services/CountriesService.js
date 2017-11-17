/**
 * CountriesService
 *
 * @description :: Countries list generator
 */

const worldCountries = require('world-countries');

const flagImg = cca3 => `/countries/${cca3.toLowerCase()}.svg`;

const list = worldCountries
  .map(({name: {common: name}, callingCode: [callingCode], cca3}) => {
    return {
      countryCode: cca3,
      name,
      phoneCode: `+${callingCode}`,
      flag: flagImg(cca3)
    };
  });

const collection = list.reduce((result, current) => {
  result[current.countryCode] = current;
  return result;
}, {});

module.exports = {
  list,
  collection,
  flagImg
};
