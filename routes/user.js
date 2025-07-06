const express = require("express");
const User = require("../models/User");
const UserInfo = require("../models/UserInfo");

const router = express.Router();

router.get('/profile/:username', async (req, res) => {
  const username = req.params.username;

  const user = await User.findOne({ username: username });
  const userInfo = await UserInfo.findOne({ userId: user._id });

   const countryMap = {
    us: { flag: "🇺🇸", name: "United States" },
    gb: { flag: "🇬🇧", name: "United Kingdom" },
    in: { flag: "🇮🇳", name: "India" },
    ca: { flag: "🇨🇦", name: "Canada" },
    au: { flag: "🇦🇺", name: "Australia" },
    de: { flag: "🇩🇪", name: "Germany" },
    fr: { flag: "🇫🇷", name: "France" },
    jp: { flag: "🇯🇵", name: "Japan" },
    cn: { flag: "🇨🇳", name: "China" },
    ru: { flag: "🇷🇺", name: "Russia" },
    br: { flag: "🇧🇷", name: "Brazil" },
    za: { flag: "🇿🇦", name: "South Africa" },
    it: { flag: "🇮🇹", name: "Italy" },
    mx: { flag: "🇲🇽", name: "Mexico" },
    es: { flag: "🇪🇸", name: "Spain" },
    kr: { flag: "🇰🇷", name: "South Korea" },
    sa: { flag: "🇸🇦", name: "Saudi Arabia" },
    tr: { flag: "🇹🇷", name: "Turkey" },
    ar: { flag: "🇦🇷", name: "Argentina" },
    id: { flag: "🇮🇩", name: "Indonesia" },
    nl: { flag: "🇳🇱", name: "Netherlands" },
    se: { flag: "🇸🇪", name: "Sweden" },
    ch: { flag: "🇨🇭", name: "Switzerland" },
    ua: { flag: "🇺🇦", name: "Ukraine" },
    pl: { flag: "🇵🇱", name: "Poland" },
    no: { flag: "🇳🇴", name: "Norway" },
    bd: { flag: "🇧🇩", name: "Bangladesh" },
    pk: { flag: "🇵🇰", name: "Pakistan" },
    ng: { flag: "🇳🇬", name: "Nigeria" },
    th: { flag: "🇹🇭", name: "Thailand" },
    my: { flag: "🇲🇾", name: "Malaysia" },
    sg: { flag: "🇸🇬", name: "Singapore" },
    nz: { flag: "🇳🇿", name: "New Zealand" },
    eg: { flag: "🇪🇬", name: "Egypt" },
    cz: { flag: "🇨🇿", name: "Czech Republic" },
    fi: { flag: "🇫🇮", name: "Finland" },
    dk: { flag: "🇩🇰", name: "Denmark" },
    il: { flag: "🇮🇱", name: "Israel" },
    ph: { flag: "🇵🇭", name: "Philippines" },
    ve: { flag: "🇻🇪", name: "Venezuela" },
    cl: { flag: "🇨🇱", name: "Chile" },
    ie: { flag: "🇮🇪", name: "Ireland" },
    at: { flag: "🇦🇹", name: "Austria" },
    be: { flag: "🇧🇪", name: "Belgium" },
    gr: { flag: "🇬🇷", name: "Greece" },
    pt: { flag: "🇵🇹", name: "Portugal" },
    ro: { flag: "🇷🇴", name: "Romania" },
    hu: { flag: "🇭🇺", name: "Hungary" },
    co: { flag: "🇨🇴", name: "Colombia" },
    vn: { flag: "🇻🇳", name: "Vietnam" }
  };

  if (!user) {
    res.status(400).send('usernmae is required!! Or user will not avaliable');
  } else {
    res.render('user/userprofile', {
      user: {
        username: user.username,
        createdAt: user.createdAt,
        isLoggedIn: false,
      },
      userInfo,
      countryMap
    });
  }
});

module.exports = router;