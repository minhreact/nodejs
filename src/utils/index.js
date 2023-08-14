"use strict";

const _ = require("lodash");
const { Types } = require("mongoose");

const convertToObjectIdMongodb = (id) => new Types.ObjectId(id);

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

const removeUndefinedObject = (object) => {
  Object.keys(object).forEach((key) => {
    if (object[key] == null) delete object[key];
  });
  return object;
};

/*
  const a = {
    c: {
      d: 1
    }
  }

  db.collection.updateOne({}, {`c.d`: 1})

*/

const updateNestObjectParser = (object) => {
  const final = {};
  Object.keys(object).forEach((key) => {
    if (typeof object[key] === "object" && !Array.isArray(object[key])) {
      const response = updateNestObjectParser(object[key]);
      Object.keys(response).forEach((key2) => {
        final[`${key}.${key2}`] = response[key2];
      });
    } else {
      final[key] = object[key];
    }
  });
  return final;
};

module.exports = {
  getIntoData,
  getSelectData,
  unGetSelectData,
  removeUndefinedObject,
  updateNestObjectParser,
  convertToObjectIdMongodb,
};
