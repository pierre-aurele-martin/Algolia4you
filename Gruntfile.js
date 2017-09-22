module.exports = function(grunt) {

	//grunt.file.expandMapping
	//<!-- include: "type": "css", "files": "<%= sources.all.css %>" -->

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		sources:{
			pkg: '<%= pkg %>',
			all: {
				favicons: [
					{rel: 'apple-touch-icon', sizes: '57x57', href: 'dist/img/favicon/apple-icon-57x57.png'},
			        {rel: 'apple-touch-icon', sizes: '60x60', href: 'dist/img/favicon/apple-icon-60x60.png'},
			        {rel: 'apple-touch-icon', sizes: '72x72', href: 'dist/img/favicon/apple-icon-72x72.png'},
			        {rel: 'apple-touch-icon', sizes: '76x76', href: 'dist/img/favicon/apple-icon-76x76.png'},
			        {rel: 'apple-touch-icon', sizes: '114x114', href: 'dist/img/favicon/apple-icon-114x114.png'},
			        {rel: 'apple-touch-icon', sizes: '120x120', href: 'dist/img/favicon/apple-icon-120x120.png'},
			        {rel: 'apple-touch-icon', sizes: '144x144', href: 'dist/img/favicon/apple-icon-144x144.png'},
			        {rel: 'apple-touch-icon', sizes: '152x152', href: 'dist/img/favicon/apple-icon-152x152.png'},
			        {rel: 'apple-touch-icon', sizes: '180x180', href: 'dist/img/favicon/apple-icon-180x180.png'},
			        {rel: 'icon', sizes: '192x192', href: 'dist/img/favicon/android-icon-192x192.png'},
			        {rel: 'icon', sizes: '32x32', href: 'dist/img/favicon/favicon-32x32.png'},
			        {rel: 'icon', sizes: '96x96', href: 'dist/img/favicon/favicon-96x96.png'},
			        {rel: 'icon', sizes: '16x16', href: 'dist/img/favicon/favicon-16x16.png'}
			    ],
				css: [
					'//maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css',
					'//fonts.googleapis.com/css?family=Lato:300,400,700,300italic,400italic,700italic',
					'dist/css/app.min.css'
				],
				js : { 
					'IE9': [
						'https://oss.maxcdn.com/libs/html5shiv/3.7.0/html5shiv.js',
        				'https://oss.maxcdn.com/libs/respond.js/1.4.2/respond.min.js'
					],
					'footer': [
						'//ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js',
						'//maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js',
						'dist/js/app.min.js'
					]
				},
				navbar : grunt.file.read('src/tpl/navbar.tpl.html')
			},
			algolia: {
				css: [
					'//cdn.jsdelivr.net/npm/instantsearch.js@2.0.2/dist/instantsearch.min.css'
				],
				js: {
					'footer': [
						'//cdn.jsdelivr.net/npm/algoliasearch@3/dist/algoliasearchLite.min.js',
						'//cdn.jsdelivr.net/npm/algoliasearch-helper@2.21.2/dist/algoliasearch.helper.min.js',
						'//cdn.jsdelivr.net/npm/instantsearch.js@2.0.2/dist/instantsearch.min.js',
						'//cdn.jsdelivr.net/autocomplete.js/0/autocomplete.jquery.min.js',
					]
				}
			}
		},
		concat: {
			options: {
				separator: ';',
			},
			dist: {
				src: ['src/js/**/*.js'],
				dest: 'src/app.js'
			},
		},
		uglify: {
			options:{
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
			},
			dist: {
				files: {
					'dist/js/app.min.js': ['<%= concat.dist.dest %>']
				}
			}
		},
		jshint: {
      		files: ['Gruntfile.js', 'src/js/*.js'],
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
	    template: {
	        options: {
	            // Task-specific options go here
	        },
	        dist: {
	            options: {
	            	data: '<%= sources %>'
	            },
	            files: {
	                'index.html': ['src/tpl/index.tpl.html'],
	                'algolia.html': ['src/tpl/algolia.tpl.html']
	            }
	        }
	    },
	    htmllint: {
	    	src : ['*.html'],
	    	options: {
	    		'attr-name-style': 'dash',
	    		'id-class-style': 'dash'
	    	}
	    },
	    sass: {
    		dist: {
      			options: {
        			style: 'expanded'
      			},
      			files: {
        			'src/css/style.css': 'src/sass/style.sass'
      			}
    		}
  		},
	    cssmin: {
  			options: {
    			mergeIntoShorthands: false,
    			roundingPrecision: -1
  			},
  			dist: {
	    		files: {
	      			'dist/css/app.min.css': ['src/css/style.css', 'src/css/open-iconic-bootstrap.min.css']
	    		}
	  		}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-htmllint');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-template');
	grunt.loadNpmTasks('grunt-contrib-sass');

	grunt.registerTask('default', ['concat', 'jshint', 'uglify', 'sass', 'cssmin', 'template', 'htmllint']);

};