# !/bin/bash/env coffee

lazy = require 'lazy'
fs   = require 'fs'
{spawn, exec}  = require 'child_process'

laze = ()->
    filename = Array.prototype.slice.call(arguments)[0]
    lazy(filename)
        .lines
        .map (lines)->
            field = line.trim().replace(/\t/i).split('|')
            return {
                source: field[0],
                target: field[1],
                value: field[2]
            }

module.exports = laze
