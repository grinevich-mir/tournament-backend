######################################################################################################################################################################################
# !! NOTICE !!                                                                                                                                                                       #
# This configuration file has been generated with a template, if you need to make changes, edit the config.yml.tpl file and run the 'yarn circle-gen' in the root of the repo.      #
######################################################################################################################################################################################

version: 2.1

jobs:
  build:
    docker:
      - image: circleci/node:14
    resource_class: xlarge
    parameters:
      persist:
        type: boolean
        default: false
    steps:
      - checkout
      - restore_cache:
          name: Restore Yarn Package Cache
          keys:
            - yarn-packages-v1-{{ .Branch }}-{{ checksum "yarn.lock" }}
            - yarn-packages-v1-{{ .Branch }}-
            - yarn-packages-v1-
      - run:
          name: Install
          command: yarn ci
      - save_cache:
          name: Save Yarn Package Cache
          key: yarn-packages-v1-{{ .Branch }}-{{ checksum "yarn.lock" }}
          paths:
            - ~/.cache/yarn
      - run:
          name: Lint
          command: yarn lint
      - run:
          name: Build
          command: yarn build
      - run:
          name: Test
          command: yarn test
          when: always
      - run:
          name: Copy Results
          command: yarn test-helper copy ~/test-results
          when: always
      - store_test_results:
          path: ~/test-results
      - store_artifacts:
          path: ~/test-results
      - when:
          condition: << parameters.persist >>
          steps:
            - persist_to_workspace:
                root: .
                paths:
                  - .
  deploy:
    docker:
      - image: circleci/node:14
    parameters:
      brand:
        type: string
      stage:
        type: string
      region:
        type: string
      location:
        type: string
    steps:
      - attach_workspace:
          at: .
      - run:
          name: Add AWS credentials
          command: mkdir ~/.aws && echo -e "[platform-<< parameters.brand >>-<< parameters.stage >>]\naws_access_key_id=$AWS_ACCESS_KEY_ID\naws_secret_access_key=$AWS_SECRET_ACCESS_KEY\n" > ~/.aws/credentials
      - run:
          name: Deploy to << parameters.stage >> in region << parameters.region >>
          command: yarn --cwd "./<< parameters.location >>" deploy --brand << parameters.brand >> --stage << parameters.stage >> --region << parameters.region >>
  deploy-docker:
    docker:
      - image: circleci/node:14
    parameters:
      brand:
        type: string
      stage:
        type: string
      region:
        type: string
      location:
        type: string
    steps:
      - attach_workspace:
          at: .
      - setup_remote_docker:
          docker_layer_caching: true
      - run:
          name: Add AWS credentials
          command: mkdir ~/.aws && echo -e "[platform-<< parameters.brand >>-<< parameters.stage >>]\naws_access_key_id=$AWS_ACCESS_KEY_ID\naws_secret_access_key=$AWS_SECRET_ACCESS_KEY\n" > ~/.aws/credentials
      - run:
          name: Deploy to << parameters.stage >> in region << parameters.region >>
          command: yarn --cwd "./<< parameters.location >>" deploy --brand << parameters.brand >> --stage << parameters.stage >> --region << parameters.region >>
  deploy-docs:
    docker:
      - image: circleci/node:14
    parameters:
      brand:
        type: string
      stage:
        type: string
      region:
        type: string
      api:
        type: string
    steps:
      - attach_workspace:
          at: .
      - run:
          name: Add AWS credentials
          command: mkdir ~/.aws && echo -e "[platform-<< parameters.brand >>-<< parameters.stage >>]\naws_access_key_id=$AWS_ACCESS_KEY_ID\naws_secret_access_key=$AWS_SECRET_ACCESS_KEY\n" > ~/.aws/credentials
      - run:
          name: Deploy API Docs - << parameters.api >>
          command: cd services/docs && yarn deploy --brand << parameters.brand >> --stage << parameters.stage >> --api << parameters.api >> --region << parameters.region >>
workflows:
  version: 2
  build:
    jobs:
      - build:
          filters:
            branches:
              ignore:
                - dev
                - master
  build-deploy:
    jobs:
      - build:
          name: build-deploy
          persist: true
          filters:
            branches:
              only:
                - dev
                - master
<%# this %>

      # Brand: <% name %>
  <%# regions %>
      # DEPLOY dev - <% this %>
      <%# ../groups %>
      # <% name %>
      <%# deployables %>
      <%# ifIn ../../this regions %>
      <%# if useDocker %>
      - deploy-docker:
      <% else %>
      - deploy:
      <%/ if %>
          name: <% ../../../brand %>-deploy-dev-<% name %>-<% ../../this %>
          requires:
            <%# if first %>
            - <% ../../../brand %>-deploy-dev-<% first.name %>-<% ../../this %>
            <% else %>
            - build-deploy
            <%/ if %>
          filters:
            branches:
              only: dev
          context: platform-<% ../../../brand %>-dev
          region: <% ../../this %>
          brand: <% ../../../brand %>
          stage: dev
          location: "<% location %>"
      <%/ ifIn %>
      <%/ deployables %>
      <%/ ../groups %>
      <%# iff this '==' ../primaryRegion %>
      # Docs
      - deploy-docs:
          name: <% ../brand %>-deploy-mgnt-docs-dev-<% this %>
          requires:
              - build-deploy
          filters:
            branches:
              only: dev
          context: platform-<% ../brand %>-dev
          region: <% this %>
          brand: <% ../brand %>
          stage: dev
          api: management
      <%/ iff %>
      - deploy-docs:
          name: <% ../brand %>-deploy-client-docs-dev-<% this %>
          requires:
              - build-deploy
          filters:
            branches:
              only: dev
          context: platform-<% ../brand %>-dev
          region: <% this %>
          brand: <% ../brand %>
          stage: dev
          api: client
  <%/ regions %>
  <%# regions %>
      # DEPLOY prod - <% this %>
      <%# ../groups %>
      # <% name %>
      <%# deployables %>
      <%# ifIn ../../this regions %>
      <%# if useDocker %>
      - deploy-docker:
      <% else %>
      - deploy:
      <%/ if %>
          name: <% ../../../brand %>-deploy-prod-<% name %>-<% ../../this %>
          requires:
            <%# if first %>
            - <% ../../../brand %>-deploy-prod-<% first.name %>-<% ../../this %>
            <% else %>
            - build-deploy
            <%/ if %>
          filters:
            branches:
              only: master
          context: platform-<% ../../../brand %>-prod
          region: <% ../../this %>
          brand: <% ../../../brand %>
          stage: prod
          location: "<% location %>"
      <%/ ifIn %>
      <%/ deployables %>
      <%/ ../groups %>
  <%/ regions %>
<%/ this %>