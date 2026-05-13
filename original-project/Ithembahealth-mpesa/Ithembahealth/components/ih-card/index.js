Component({
  props: { onTap: null },
  methods: {
    tap: function () {
      if (this.props.onTap) this.props.onTap();
    }
  }
});
