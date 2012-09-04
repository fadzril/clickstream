# !/bin/bash/env coffee

fs          = require 'fs'
buffered    = require 'buffered-reader'
file        = 'part-r-00000.txt'
dir         = "#{process.cwd()}/public/api"
filewrite   = []
offset      = null

buffer = ->
    filename = Array.prototype.slice.call(arguments)[0]
    new buffered(filename, {encoding: 'utf8'})
        .on("error", (error)->
            console.log error
        )
        .on("line", (line, byteOffset)->
            lines = line.replace(/\t/i, '|').split('|')
            node = 
                source: lines[0]
                target: lines[1]
                value: lines[2]
            filewrite.push node
        )
        .on("end", ->
            @seek offset, (error)->
                console.log "seek error: #{error}" if error

            @readBytes 9, (error, bytes, bytesRead)->
                console.log error if error
                console.log " total bytes: %s", bytes
                @close (error)->
                    console.log error if error

            fs
                .createWriteStream("#{dir}/#{file.replace('.txt', '')}.json", {file: 'w'})
                .write(JSON.stringify({nodes: filewrite}))
        )
        .read()

module.exports = buffer