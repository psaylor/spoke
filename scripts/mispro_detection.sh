#!/bin/bash

# Usage: run_misp_detect_final.sh $data_dir
# Outputs the mispronunciation results to stdout

echo "Running mispronuncation detection on files in $1"

data_dir=$1

cd /usr/users/annlee/for_trish
./run_misp_detect_approx.sh $data_dir
