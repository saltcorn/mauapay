const Workflow = require("@saltcorn/data/models/workflow");
const Form = require("@saltcorn/data/models/form");
const View = require("@saltcorn/data/models/view");
const User = require("@saltcorn/data/models/user");
const { getState } = require("@saltcorn/data/db/state");
const db = require("@saltcorn/data/db");
const axios = require("axios");
const { createHash, createHmac } = require("crypto");
const configuration_workflow = () => {
  const cfg_base_url = getState().getConfig("base_url");

  return new Workflow({
    steps: [
      {
        name: "Mauapay configuration",
        form: () =>
          new Form({
            labelCols: 3,
            blurb: !cfg_base_url
              ? "You should set the 'Base URL' configration property. "
              : "",
            fields: [
              {
                name: "publishableKey",
                label: "Publishable API key",
                type: "String",
                required: true,
              },
              {
                name: "secretKey",
                label: "Secret API key",
                type: "String",
                required: true,
              },
            ],
          }),
      },
    ],
  });
};

// user subscribe action
const actions = ({ publishableKey, secretKey }) => ({
  mauapay_payment_request: {
    configFields: async ({ table }) => {
      const fields = table ? await table.getFields() : [];
      const cbviews = await View.find({ viewtemplate: "MauaPay Callback" });
      return [
        {
          name: "order_id_field",
          label: "OrderID field",
          type: "String",
          required: true,
          attributes: {
            options: fields.map((f) => f.name),
          },
        },

        {
          name: "amount_field",
          label: "Amount field",
          type: "String",
          required: true,
          attributes: {
            options: fields
              .filter((f) => ["Float", "Integer"].includes(f.type?.name))
              .map((f) => f.name),
          },
        },
        {
          name: "callback_view",
          label: "Callback view",
          type: "String",
          required: true,
          attributes: {
            options: cbviews.map((f) => f.name),
          },
        },
      ];
    },
    run: async ({
      req,
      row,
      configuration: { order_id_field, amount_field, callback_view },
    }) => {
      const cfg_base_url = getState().getConfig("base_url");
      const cb_url = `${cfg_base_url}view/${callback_view}`;
      const orderID = row[order_id_field];
      const amount = row[amount_field].toFixed(2);
      const paymentService = "digicel";
      const checkStr = `${orderID}:${amount}:${cb_url}:${cb_url}:${cb_url}:${cb_url}:${paymentService}`;

      const checksum = createHmac("sha256", secretKey)
        .update(checkStr)
        .digest("hex");
      const form = new URLSearchParams({});
      form.append("orderID", orderID);
      form.append("amount", amount);
      form.append("successURL", cb_url);
      form.append("failureURL", cb_url);
      form.append("processingURL", cb_url);
      form.append("cancellationURL", cb_url);
      form.append("paymentService", paymentService);
      form.append("checksum", checksum);
      form.append("settlementCurrency", "WST");
      try {
        const { data } = await axios.post(
          "https://api.mauapay.com/api/v1/transactions",
          form,
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "x-business-publishable-key": publishableKey,
            },
          }
        );
        console.log("fetchres", data);
        const need_response_checksum = createHmac("sha256", secretKey)
          .update(`${data.token}:${data.referenceID}`)
          .digest("hex");
        if (data.checksum !== need_response_checksum) {
          console.error("checksum mismatch", need_response_checksum);
          return { error: "Payment integration response not verified" };
        }

        return {
          goto: `https://www.mauapay.com/end-point?token=${data.token}`,
        };
      } catch (e) {
        console.error(e);
        console.error("checksum string", checkStr);
        console.error("request configuration", e.config);
        console.error("response data", e.response?.data);
        return { error: e.response?.data?.message || e.message };
      }
    },
  },
});

const viewtemplates = ({ publishableKey, secretKey }) => {
  return [
    {
      name: "MauaPay Callback",
      display_state_form: false,
      configuration_workflow: () => new Workflow({ steps: [] }),
      get_state_fields: () => [],
      run: async (table_id, viewname, view_cfg, state, { req }) => {
        console.log("state", state);
        const checkStr = `${state.token}:${state.referenceID}:${state.status}`;
        const need_response_checksum = createHmac("sha256", secretKey)
          .update(checkStr)
          .digest("hex");
        if (state.checksum !== need_response_checksum) {
          console.error("checksum mismatch", need_response_checksum, checkStr);
          return "Payment integration response not verified";
        }
        return "Hello from MauaPay Callback";
      },
    },
  ];
};

module.exports = {
  sc_plugin_api_version: 1,
  configuration_workflow,
  actions,
  viewtemplates,
};
