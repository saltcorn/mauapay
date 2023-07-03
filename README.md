# Mauapay Saltcorn module

To use this module:

1. Install in your Saltcorn Application from the module store. You will be prompted for the publishable
   API key and the secret API key. Enter this as you find them in the Mauapay account business information.

2. Create a table to represent payment requests. This should have the following fields:

   - A Float field for amounts
   - a String fields for the transaction reference ID
   - Either a Bool Field for whether the transaction has succeeded (payment made), or a String field for status. You can also have both of these fields

3. Create at least one Show view on this table. This is the view that will be shown when a transaction has finished
   and has been verified as succeeded/failed/cancelled etc.

4. Create a view on this table with the pattern `MauaPay Callback`. This needs to be configured with the fields on your table and you also need to select the show views the user will be directed to in case of success/failure/cancellation

5. Create an Insert trigger on this table with the `mauapay_payment_request` action type. This needs to be configured with the fields and with the call back view that you created above

6. Create an Edit view on this table, or find some other way of inserting rows in the table. Now whenever a row is inserted it will perform a payment request. If you are inserting this using some other method then edit forms, we may need to test it and see if it works. I have only tested with Edit views
