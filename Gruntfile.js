module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		concat: {
			options: {
				separator: ';'
			},
			dist: {
				src: ['src/**/*.js'],
				dest: 'dist/<%= pkg.name %>.js'
			},
		},
		uglify: {
			options:{
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
			},
			dist: {
				files: {
					'dist/app.min.js': ['<%= concat.dist.dest %>']
				}
			}
		},
		jshint: {
      		files: ['Gruntfile.js', 'src/**/*.js'],
	      	options: {
		        // options here to override JSHint defaults
		        globals: {
		          jQuery: true,
		          console: true,
		          module: true,
		          document: true
		        }
	      	}
	    },
	    htmllint: {
	    	src : ['index.html', 'algolia.html'],
	    	options: {
	    		force: true
	    	}
	    }
	});

	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-htmllint');


	grunt.registerTask('default', ['jshint','concat', 'uglify', 'htmllint']);

};