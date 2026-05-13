let liveDigits = "";
let digitTimer = null;

let livePassword = "";
let passTimer = null;

Page({
  data: {
    loading: false,
    errorMsg: ""
  },

  /** PHONE INPUT — flicker-proof */
  onDigitsTyping(e) {
    let raw = String(e.detail.value || "").replace(/\D/g, "");
    if (raw.length > 8) raw = raw.substring(0, 8);
    liveDigits = raw;

    clearTimeout(digitTimer);
    digitTimer = setTimeout(() => {}, 80);
  },

  /** PASSWORD INPUT — flicker-proof */
  onPassTyping(e) {
    let v = String(e.detail.value || "");
    livePassword = v;

    clearTimeout(passTimer);
    passTimer = setTimeout(() => {}, 80);
  },

  /** SUBMIT */
  async submit() {
    const digits = liveDigits;
    const pass = livePassword;

    if (!digits || digits.length !== 8) {
      return this.setData({ errorMsg: "Enter an 8-digit Lesotho number." });
    }

    if (!pass) {
      return this.setData({ errorMsg: "Password is required." });
    }

    const phone = "+266" + digits;

    if (this.data.loading) return;
    this.setData({ loading: true, errorMsg: "" });

    try {
      const auth = require("../../../utils/auth.js");
      const r = await auth.login(phone, pass);

      if (r && r.ok) {
        const body = r.data || r;

        if (body.accessToken) {
          my.setStorageSync({ key: "ih_at", data: body.accessToken });
          my.setStorageSync({ key: "ih_rt", data: body.refreshToken || "" });
        }

        my.reLaunch({ url: "/pages/home/index" });
      } else {
        this.setData({ errorMsg: r.message || "Login failed" });
      }

    } catch (e) {
      this.setData({ errorMsg: "Could not sign in. Try again." });

    } finally {
      this.setData({ loading: false });
    }
  },

  /** FORGOT PASSWORD stub */
  forgotPass() {
    my.alert({
      title: "Coming soon",
      content: "Password reset will be available shortly."
    });
  },

  /** REGISTER */
  toRegister() {
    my.navigateTo({ url: "/pages/auth/register/index" });
  },

  /** TERMS */
  toTerms() {
    my.navigateTo({ url: "/pages/terms/index" });
  }
});
