"use strict";

const _ = require("lodash");

const getIntoData = ({ fields = [], object = {} }) => {
  return _.pick(object, fields);
};

// ['a','b'] => {a:1,b:1}
const getSelectData = (select = []) => {
  return Object.fromEntries(select.map((item) => [item, 1]));
};

// ['a','b'] => {a:0,b:0}
const unGetSelectData = (select = []) => {
  return Object.fromEntries(select.map((item) => [item, 0]));
};

module.exports = {
  getIntoData,
  getSelectData,
  unGetSelectData,
};
