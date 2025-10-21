// src/data/dummyData.js
export const dummyCatalogData = {
  respId: "RES00001",
  userType: "3",
  master: {
    offer: [
      {
        name: "Random Blood Sugar",
        code: "PROJ1020761",
        type: "OFFER",
        childs: [{ name: "RBS", code: "RBS", groupName: "WELLNESS", type: "TEST" }],
        rate: { b2B: "", b2C: "280", offerRate: "99", id: "PROJ1020761" },
        testCount: "1",
        fasting: "NF",
        imageLocation: "https://b2capi.thyrocare.com/wellness/img/Banner/RBS_banner.jpg",
      },
    ],
    profile: [
      {
        name: "ADVANCED RENAL PROFILE",
        code: "P522",
        type: "PROFILE",
        rate: { b2B: "310", b2C: "650", offerRate: "650", id: "9821" },
        testCount: "11",
        fasting: "CF",
        specimenType: "SERUM",
        imageLocation: "https://b2capi.thyrocare.com/wellness/img/Banner/P522_banner.jpg",
      },
      {
        name: "HEMOGRAM - 6 PART (DIFF)",
        code: "P187",
        testCount: "30",
        bookedCount: "549",
        category: "WELLNESS",
        specimenType: "EDTA",
        fasting: "NF",
        rate: { b2B: "75", b2C: "314", offerRate: "310", id: "3273" },
        imageLocation: "http://b2capi.thyrocare.com/wellness/img/Banner/P187_banner.jpg",
      },
    ],
    tests: [
      {
        name: "FASTING BLOOD SUGAR",
        code: "FBS",
        type: "TEST",
        rate: { b2B: "15", b2C: "149", offerRate: "149", id: "11313" },
        testCount: "1",
        fasting: "CF",
        specimenType: "FLUORIDE",
        imageLocation: "https://b2capi.thyrocare.com/wellness/img/Banner/FBS_banner.jpg",
      },
      {
        name: "LIPID PROFILE",
        code: "LIPID",
        type: "TEST",
        rate: { b2B: "200", b2C: "500", offerRate: "449", id: "12345" },
        testCount: "8",
        fasting: "CF",
        specimenType: "SERUM",
        imageLocation: "https://b2capi.thyrocare.com/wellness/img/Banner/LIPID_banner.jpg",
      },
    ],
  },
};