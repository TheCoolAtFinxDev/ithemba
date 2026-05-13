let liveDigits = "";
let digitTimer = null;

let livePassword = "";
let passTimer = null;

let liveConfirm = "";
let confirmTimer = null;

Page({
  data: {
    digits: "",
    password: "",
    confirm: "",

    passwordHidden: true,
    confirmHidden: true,

    loading: false,
    errorMsg: "",
    errTitle: "",
    errMessage: "",
    traceId: "",
    fieldErrors: []
  },

  /* ------------------------------------
   * DIGITS — ZERO FLICKER
   * ------------------------------------ */
  onDigitsTyping(e) {
    let raw = String(e.detail.value || "").replace(/\D/g, "");
    if (raw.length > 8) raw = raw.substring(0, 8);

    liveDigits = raw;

    clearTimeout(digitTimer);
    digitTimer = setTimeout(() => {
      if (this.data.digits !== liveDigits) {
        this.setData({ digits: liveDigits });
      }
    }, 100);
  },

  /* ------------------------------------
   * PASSWORD — ZERO FLICKER
   * ------------------------------------ */
  onPassTyping(e) {
    livePassword = e.detail.value || "";

    clearTimeout(passTimer);
    passTimer = setTimeout(() => {
      if (this.data.password !== livePassword) {
        this.setData({ password: livePassword });
      }
    }, 100);
  },

  /* ------------------------------------
   * CONFIRM — ZERO FLICKER
   * ------------------------------------ */
  onConfirmTyping(e) {
    liveConfirm = e.detail.value || "";

    clearTimeout(confirmTimer);
    confirmTimer = setTimeout(() => {
      if (this.data.confirm !== liveConfirm) {
        this.setData({ confirm: liveConfirm });
      }
    }, 100);
  },

  /* ------------------------------------
   * SHOW/HIDE PASSWORD (NCS — NO STRUCTURE CHANGE)
   * ------------------------------------ */
  togglePassword() {
    this.setData({ passwordHidden: !this.data.passwordHidden });
  },

  toggleConfirm() {
    this.setData({ confirmHidden: !this.data.confirmHidden });
  },

  /* ------------------------------------
   * SUBMIT
   * ------------------------------------ */
  submit() {
    const d = liveDigits;
    const pw = livePassword;
    const c = liveConfirm;

    if (!d || d.length !== 8) {
      return this.setData({ errorMsg: "Enter an 8-digit Lesotho number." });
    }
    if (!pw || !c) {
      return this.setData({ errorMsg: "All fields are required." });
    }
    if (pw !== c) {
      return this.setData({ errorMsg: "Passwords do not match." });
    }

    const phone = "+266" + d;

    this.setData({
      loading: true,
      errorMsg: "",
      errTitle: "",
      errMessage: "",
      traceId: "",
      fieldErrors: []
    });

    const self = this;
    const auth = require("../../../utils/auth.js");
    const ui = require("../../../utils/ui.js");

    auth.register(phone, pw)
      .then(res => {
        if (res && res.ok) {
          ui.toastOk("Account created");
          my.reLaunch({ url: "/pages/home/index" });
        } else {
          handleErrors(self, res);
        }
      })
      .catch(err => handleErrors(self, err))
      .finally(() => self.setData({ loading: false }));
  },

  toLogin() {
    my.navigateTo({ url: "/pages/auth/login/index" });
  }
});

/* ------------------------------------
 * PROBLEM DETAILS NORMALIZER
 * ------------------------------------ */
function handleErrors(page, err) {
  const pd = err && err.data;
  const ext = pd && pd.extensions;

  page.setData({
    errTitle: (pd && pd.title) || "Error",
    errMessage: (pd && pd.detail) || "Something went wrong",
    traceId: ext && ext.traceId,
    fieldErrors: (ext && ext.errors) || []
  });

  try { my.showToast({ type: "fail", content: page.data.errTitle }); } catch (_) {}
}
