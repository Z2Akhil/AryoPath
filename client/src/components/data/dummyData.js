// This object mimics the full response from the Catalog API.
// It is a valid JavaScript object.
export const dummyCatalogData = {
  respId: "RES00001",
  userType: "3",
  master: {
    // 1. Dummy "Offer" data
    offer: [
      {
        name: "Random Blood Sugar",
        code: "PROJ1020761",
        type: "OFFER",
        childs: [{ name: "RBS", code: "RBS", groupName: "WELLNESS", type: "TEST" }],
        rate: { b2B: "", b2C: "280", offerRate: "99", id: "PROJ1020761" },
        testCount: "1",
        benMin: "1",
        benMax: "10",
        payType: "PREPAID",
        fasting: "NF", // No Fasting
        imageLocation: "https://b2capi.thyrocare.com/wellness/img/Banner/RBS_banner.jpg",
      },
      {
        name: "Basic Allergy Test",
        code: "PROJ11111",
        type: "OFFER",
        childs: [{ name: "ALLERGY", code: "ALG", groupName: "WELLNESS", type: "TEST" }],
        rate: { b2B: "500", b2C: "1000", offerRate: "799", id: "PROJ11111" },
        testCount: "1",
        benMin: "1",
        benMax: "10",
        payType: "PREPAID",
        fasting: "NF",
        imageLocation: "https://via.placeholder.com/400x200?text=Allergy+Offer",
      },
    ],
    // 2. Dummy "Profile" data (which you call Packages)
    profile: [
      {
        name: "ADVANCED RENAL PROFILE",
        code: "P522",
        type: "PROFILE",
        childs: [{ name: "BUN/SR.CREATININE RATIO", code: "B/CR", type: "TEST" }],
        rate: { b2B: "310", b2C: "650", offerRate: "650", id: "9821" },
        testCount: "11",
        benMin: "1",
        benMax: "10",
        fasting: "CF", // Compulsory Fasting
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
    // 3. Dummy "Test" data
    tests: [
      {
        name: "FASTING BLOOD SUGAR",
        code: "FBS",
        type: "TEST",
        childs: [],
        rate: { b2B: "15", b2C: "149", offerRate: "149", id: "11313" },
        testCount: "1",
        benMin: "1",
        benMax: "10",
        fasting: "CF", // Compulsory Fasting
        specimenType: "FLUORIDE",
        imageLocation: "https://b2capi.thyrocare.com/wellness/img/Banner/FBS_banner.jpg",
      },
      {
        name: "LIPID PROFILE",
        code: "LIPID",
        type: "TEST",
        childs: [],
        rate: { b2B: "200", b2C: "500", offerRate: "449", id: "12345" },
        testCount: "8",
        benMin: "1",
        benMax: "10",
        fasting: "CF",
        specimenType: "SERUM",
        imageLocation: "https://b2capi.thyrocare.com/wellness/img/Banner/LIPID_banner.jpg",
      },
    ],
  },
};