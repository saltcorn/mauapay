const Workflow = require("@saltcorn/data/models/workflow");
const Form = require("@saltcorn/data/models/form");
const User = require("@saltcorn/data/models/user");
const { getState } = require("@saltcorn/data/db/state");
const db = require("@saltcorn/data/db");
const fetch = require("node-fetch");
const FormData = require("form-data");
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
  mauapay_paymeent_request: {
    configFields: async ({ table }) => {
      const fields = table ? await table.getFields() : [];
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
              .filter((f) => ["Float", "Integer"].f.type?.name)
              .map((f) => f.name),
          },
        },
      ];
    },
    run: async ({
      req,
      row,
      configuration: { order_id_field, amount_field },
    }) => {
      const form = new FormData();
      form.append("orderID", row[order_id_field]);
      form.append("amount", row[amount_field]);
      const fres = await fetch("https://api.mauapay.com/api/v1/transactions", {
        method: "post",
        body: form,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "x-business-publishable-key": publishableKey,
        },
      });
    },
  },
});

/*const viewtemplates = (config) => {
 

  return [
   
  ];
};*/

module.exports = {
  sc_plugin_api_version: 1,
  configuration_workflow,
  actions,
  // viewtemplates,
};
