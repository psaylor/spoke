#!/bin/bash

# to use this script, first make soft link from ./for_trish to /usr/users/annlee/for_trish
# like so
# cd orcas_island/lib
# ln -s {target-filename} {symbolic-filename}
# ln -s /usr/users/annlee/for_trish ./for_trish

echo "Decoding audio from $1"

utterance_wav=$1
utterance_txt=$2
output_dir=$3

echo "Utterance wav: $utterance_wav Utterance text: $utterance_txt Output dir: $output_dir"

cd /usr/users/annlee/for_trish
./run_single_utt.sh $utterance_wav $utterance_txt $output_dir

# timing results in output_dir/time/utterance_id.txt