var AudioDataAnalyzer = require('./audioDataAnalyzer').analyzer;

var FileDownloader = require('./fileDownloader').downloader;

var DirectoryManager = require('./directoryManager').directoryManager;

var FileManager = require('./fileManager').fileManager;

var queryObjectToOptions = function queryObjectToOptionsFunction(queryObject) {
    
    var options = {
        trackId: queryObject.trackId,
        trackFormat: queryObject.trackFormat || 'ogg',
        peaksAmount: queryObject.peaksAmount || 200,
        method: 'GET',
        serverDirectory: queryObject.serverDirectory || './downloads',
        service: queryObject.service || 'jamendo',
        detectFormat: queryObject.detectFormat || false
    };
    
    options.fileName = options.trackId + '.' + options.trackFormat;

    return options;
    
};

var analyzeAudio = function analyzeAudioFunction(filePath, options, callback) {
    
    // initialize the audioAnalyzer
    var audioDataAnalyzer = new AudioDataAnalyzer();
    
    audioDataAnalyzer.setDetectFormat(options.detectFormat);
    
    // analyze the track using ffmpeg
    audioDataAnalyzer.getPeaks(filePath, options.peaksAmount, function getValuesCallback(error, peaks) {

        // if there was no error analyzing the track
        if (!error) {

            callback(null, peaks);

        } else {

            callback(error);

        }

    });
    
};

/**
 * 
 * get the wave data for a given trackId from a file on a remote server
 * 
 * @param {type} queryObject
 * @param {type} callback
 * @returns {undefined}
 */
var getRemoteWaveData = function getRemoteWaveDataFunction(queryObject, callback) {
    
    // track options
    var options = queryObjectToOptions(queryObject);
    
    if (typeof options.trackId !== 'undefined') {

        // service options
        switch (queryObject.service) {
        
            case 'jamendo':
            default:
                
                // track format
                switch (queryObject.trackFormat) {
                    case 'ogg':
                        options.formatCode = 'ogg1';
                        break;
                    default:
                        options.formatCode = 'mp31';
                }
                
                options.remoteHost = 'storage-new.newjamendo.com';
                options.remotePath = '/download/track/' + options.trackId + '/' + options.formatCode;
                options.remotePort = 80;
            
        }
        
        // initialize the track downloader
        var fileDownloader = new FileDownloader();
        
        // download the track and write it on the disc of it does not already exist
        fileDownloader.writeToDisc(options, function writeFileCallback(error, filePath) {
            
            // if there was no error downloading and writing the track
            if (!error) {
                
                analyzeAudio(filePath, options, callback);

            } else {
                
                callback(error);

            }

        });

    } else {

        callback('please specify at least a trackId');

    }
    
};

/**
 * 
 * get the wave data for a given trackId from a local file
 * 
 * @param {type} queryObject
 * @param {type} callback
 * @returns {undefined}
 */
var getLocalWaveData = function getLocalWaveDataFunction(queryObject, callback) {
    
    // track options
    var options = queryObjectToOptions(queryObject);
    
    var directoryManager = new DirectoryManager();
    
    directoryManager.exists(options.serverDirectory, function directoryExistsCallback(error, exists) {
        
         // if there was no error checking if the directory exists
        if (!error) {
        
            // if the directory does not exist
            if (!exists) {
            
                callback('the server directory does not exist');
            
            } else {
                
                var fileManager = new FileManager();
    
                var filePath = options.serverDirectory + '/' + options.fileName;
                
                // check if the file exists
                fileManager.exists(filePath, function fileExistsCallback(error, exists) {

                    // if there was no error checking if the file exists
                    if (!error) {

                        if (!exists) {

                            callback('the file does not exist');

                        } else {

                            analyzeAudio(filePath, options, callback);

                        }

                    } else {            

                        callback(error);

                    }

                });
                
            }
            
        } else {            
            
            callback(error);
            
        }
        
    });
    
};

module.exports = {
    getRemoteWaveData: getRemoteWaveData,
    getLocalWaveData: getLocalWaveData
};