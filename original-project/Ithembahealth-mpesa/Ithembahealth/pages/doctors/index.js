Page({
  data: {
    q: '',
    doctors: [],
    hasDocs: false
  },

  onShow: function () {
    // DEFAULTS: start empty. When backend is ready, fetch and set list.
    // Example if you want sample data:
    // var list = [
    //   { id: 'd1', name: 'Dr Mokoena', specialty: 'General Practitioner', clinic: 'City Clinic', rating: '4.8' }
    // ];
    var list = [];
    var has = list && list.length > 0;
    this.setData({ doctors: list, hasDocs: has });
  },

  setQ: function (val) {
    this.setData({ q: val });
  },

  book: function (e) {
    var id = e.currentTarget.dataset.id;
    // Route to appointment creation flow; for now, just stub.
    my.alert({ title: 'Book', content: 'TODO: open booking flow for doctor ' + id });
  }
});
