#!/bin/bash

echo "Installing server dependencies..."
cp server-package.json package.json
npm install

echo "Server dependencies installed!" 