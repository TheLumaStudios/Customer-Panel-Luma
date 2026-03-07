#!/bin/bash

# Direct SOAP request to DomainNameAPI to see XML response structure

echo "🧪 Testing Direct SOAP Request to DomainNameAPI"
echo "================================================"
echo ""

# Read credentials
DNA_USERNAME="enesp"
echo -n "Enter DNA_PASSWORD: "
read -s DNA_PASSWORD
echo ""
echo ""

# Build SOAP envelope
SOAP_REQUEST='<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/" xmlns:arr="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
  <soap:Header/>
  <soap:Body>
    <tem:CheckAvailability>
      <tem:request>
        <tem:Password>'"$DNA_PASSWORD"'</tem:Password>
        <tem:UserName>'"$DNA_USERNAME"'</tem:UserName>
        <tem:DomainNameList>
          <tem:string>google</tem:string>
          <tem:string>example</tem:string>
        </tem:DomainNameList>
        <tem:TldList>
          <tem:string>com</tem:string>
          <tem:string>net</tem:string>
        </tem:TldList>
        <tem:Period>1</tem:Period>
        <tem:Command>check</tem:Command>
      </tem:request>
    </tem:CheckAvailability>
  </soap:Body>
</soap:Envelope>'

echo "📤 Sending SOAP request..."
echo ""

# Make request and save response
curl -s -X POST \
  'https://whmcs.domainnameapi.com/DomainApi.svc' \
  -H 'Content-Type: text/xml; charset=utf-8' \
  -H 'SOAPAction: http://tempuri.org/IDomainAPI/CheckAvailability' \
  -d "$SOAP_REQUEST" \
  -o /tmp/soap-response.xml

echo "📥 Response saved to: /tmp/soap-response.xml"
echo ""
echo "📄 XML Response:"
echo "================"
cat /tmp/soap-response.xml | head -100
echo ""
echo ""
echo "💡 Full response in: /tmp/soap-response.xml"
echo "   You can view it with: cat /tmp/soap-response.xml"
