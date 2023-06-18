const Workflow = require("@saltcorn/data/models/workflow");
const Form = require("@saltcorn/data/models/form");
const User = require("@saltcorn/data/models/user");
const { getState } = require("@saltcorn/data/db/state");
const db = require("@saltcorn/data/db");
const success = require("./success");
const subscribe = require("./subscribe");
const portal = require("./portal");
const { upgrade_with_session_id } = require("./common");

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
  stripe_webhook: {
    configFields: async ({ table }) => {
      const fields = table ? await table.getFields() : [];
      return [
        {
          name: "order_id_field",
          label: "amount_field",
          type: "String",
          required: true,
          attributes: {
            options: fields.map((f) => f.name),
          },
        },
      ];
    },
    run: async ({ req, body }) => {},
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
