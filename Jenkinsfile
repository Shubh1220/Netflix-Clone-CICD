pipeline {
    agent any

    environment {
        // Jenkins Tools
        SONAR_HOME  = tool "Sonar"
        NODEJS_HOME = tool "NodeJS"
        PATH        = "${NODEJS_HOME}/bin:${env.PATH}"
        
        // Docker
        IMAGE_NAME  = "opsshubh/my-streamflix-clone"   // Your Docker Hub Username
        IMAGE_TAG   = "latest"

        // AWS EC2
        EC2_HOST    = "98.94.3.126"   // Your EC2 Instance IP Address
        EC2_USER    = "ubuntu"
        APP_NAME    = "streamflix"
        DEPLOY_PORT = "8081"
    }

    stages {

        stage('Checkout') {
            steps {
                git(
                    url: 'https://github.com/Shubh1220/Netflix-Clone-CICD.git',
                    branch: 'main'
                )
            }
        }

        stage('Install Dependencies') {
            steps {
                dir('app') {
                    sh 'npm ci --no-audit --no-fund'
                }
            }
        }

        stage('Tests') {
            steps {
                dir('app') {
                    sh 'npm test'
                }
            }
        }

        stage('Build') {
            steps {
                dir('app') {
                    sh 'npm run build'
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                dir('app') {
                    withSonarQubeEnv('Netflix-Clone') {
                        sh """
                            ${SONAR_HOME}/bin/sonar-scanner \
                              -Dsonar.projectKey=netflix-clone \
                              -Dsonar.sources=src \
                              -Dsonar.exclusions=node_modules/**,dist/**
                        """
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('OWASP Dependency Check') {
            steps {
                dir('app') {
                    dependencyCheck(
                        additionalArguments: '''
                            --scan .
                            --format ALL
                            --exclude node_modules/**
                            --suppression ../dependency-check-suppression.xml
                        ''',
                        odcInstallation: 'owasp-dependency-check'
                    )

                    dependencyCheckPublisher(
                        pattern: 'dependency-check-report.xml'
                    )
                }
            }
        }

        stage('Trivy Filesystem Scan') {
            steps {
                dir('app') {
                    sh '''
                        trivy fs \
                          --format table \
                          -o trivy-fs-report.txt \
                          .
                    '''
                }
            }
        }

        stage('Docker Build') {
            steps {
                dir('app') {
                    withCredentials([
                        string(
                            credentialsId: 'tmdb-api-key',
                            variable: 'TMDB_API_KEY'
                        )
                    ]) {
                        sh '''
                            docker build \
                              --build-arg VITE_TMDB_API_KEY="$TMDB_API_KEY" \
                              -t ${IMAGE_NAME}:${IMAGE_TAG} \
                              -t ${IMAGE_NAME}:latest \
                              .
                        '''
                    }
                }
            }
        }

        stage('Trivy Image Scan') {
            steps {
                sh '''
                    trivy image \
                      --format table \
                      -o trivy-image-report.txt \
                      ${IMAGE_NAME}:${IMAGE_TAG}
                '''
            }
        }

        stage('Docker Push') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhubcred',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )
                ]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login \
                          -u "$DOCKER_USER" \
                          --password-stdin

                        docker push ${IMAGE_NAME}:${IMAGE_TAG}
                        docker push ${IMAGE_NAME}:latest

                        docker logout
                    '''
                }
            }
        }

        stage('Deploy to EC2') {
            steps {
                sshagent(credentials: ['netflix-server-key']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} '
                            docker pull ${IMAGE_NAME}:latest &&
                            (docker stop ${APP_NAME} || true) &&
                            (docker rm ${APP_NAME} || true) &&
                            docker run -d \
                              --name ${APP_NAME} \
                              -p ${DEPLOY_PORT}:80 \
                              --restart unless-stopped \
                              ${IMAGE_NAME}:latest
                        '
                    """
                }
            }
        }

        stage('Health Check') {
            steps {
                sshagent(credentials: ['netflix-server-key']) {
                    sh '''
                       i=1

                       while [ "$i" -le 10 ]
                       do
                         
                         if ssh -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} \
                            "curl -sf http://localhost:${DEPLOY_PORT}/healthz"
                         then
                            echo "Application is healthy"
                            exit 0
                         fi

                         echo "Waiting for application to become healthy ($i/10)..."
                         sleep 5
                         i=$((i + 1))
                     done

                     echo "Health check failed"
                     exit 1
                   '''
                }
            }
        }
    }

    post {

        success {
            echo "Pipeline succeeded: ${IMAGE_NAME}:${IMAGE_TAG} deployed to ${EC2_HOST}."
        }

        failure {
            echo "Pipeline failed at build. Check the stage logs above."
        }

        always {
            sh 'docker system prune -f || true'
        }
    }
}
