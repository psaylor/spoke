#!/bin/bash

# Usage: run_misp_detect_final.sh $data_dir
# Outputs the mispronunciation results to stdout?

echo "Running mispronuncation detection on files in $1"

data_dir=$1
utt_id=$2

# Call after every run of forced alignment for pre-processing for misp detection

cd /usr/users/annlee/for_trish
./run_preprocessing.sh $data_dir $utt_id